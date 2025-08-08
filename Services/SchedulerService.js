const cron = require("node-cron");
const ping = require("ping");
const { executeQuery } = require("../Services/CrudService");

// Direct ping function (no API call needed)
async function performDirectPing(ip, numPings = 4) {
  let results = [];
  let totalPingTime = 0;
  let packetLoss = 0;

  for (let i = 0; i < numPings; i++) {
    const response = await ping.promise.probe(ip);
    results.push(response.time);
    totalPingTime += response.time || 0;
    if (response.alive === false) {
      packetLoss++;
    }
  }

  const avg = totalPingTime / numPings;
  const min = Math.min(...results.filter(Boolean));
  const max = Math.max(...results.filter(Boolean));
  const status = avg <= 100 ? "Healthy" : avg > 100 && avg < 500 ? "Delayed" : "Unresponsive";

  return {
    ip,
    time: avg,
    status,
    alive: packetLoss === 0,
    timestamp: new Date(),
    details: {
      packetLoss: (packetLoss / numPings).toFixed(3),
      min,
      max,
      avg,
      numPings,
    },
  };
}

async function insertPingLog(ip, pingResult) {

  let current_date = new Date();
  let formatted_date = current_date.getFullYear() + '-'
    + (current_date.getMonth() + 1).toString().padStart(2, '0') + '-'
    + current_date.getDate().toString().padStart(2, '0') + ' '
    + current_date.getHours().toString().padStart(2, '0') + ':'
    + current_date.getMinutes().toString().padStart(2, '0') + ':'
    + current_date.getSeconds().toString().padStart(2, '0');
  // Assuming pingResult is an object with the relevant fields
  const pingResultString = JSON.stringify(pingResult); // Convert pingResult to string if needed
  const query = "INSERT INTO PING_LOG (HOST_IP, PING_RESULT,CREATION_DATE) VALUES (?, ?,?)";

  console.log(query)

  await executeQuery(query, [ip, pingResultString, formatted_date]);
}



// Update the ping_time for an IP in PingStatus
async function updatePingTime(pingResult, ip) {
  let current_date = new Date();
  let formatted_date = current_date.getFullYear() + '-'
    + (current_date.getMonth() + 1).toString().padStart(2, '0') + '-'
    + current_date.getDate().toString().padStart(2, '0') + ' '
    + current_date.getHours().toString().padStart(2, '0') + ':'
    + current_date.getMinutes().toString().padStart(2, '0') + ':'
    + current_date.getSeconds().toString().padStart(2, '0');
  const shestatus = 'Completed';
  const query = `UPDATE DEVICE_TBL SET LAST_RUN = ?, DEVICE_STATUS = ?, PING_TIME = ?, SHEDULE_PING_STATUS = ?,PING_STATUS = ? WHERE HOST_IP = ?`;

  console.log("Corn run")
  await executeQuery(query, [formatted_date, pingResult.alive, pingResult.time, shestatus, pingResult.status, ip]);
}





// Fetch tasks scheduled for execution
async function fetchTasksToRun() {
  let current_date = new Date();
  let formatted_date = current_date.getFullYear() + '-'
    + (current_date.getMonth() + 1).toString().padStart(2, '0') + '-'
    + current_date.getDate().toString().padStart(2, '0') + ' '
    + current_date.getHours().toString().padStart(2, '0') + ':'
    + current_date.getMinutes().toString().padStart(2, '0') + ':'
    + current_date.getSeconds().toString().padStart(2, '0');



  const query = `SELECT * FROM ScheduledTasks WHERE (STATUS = 'SCHEDULED' OR STATUS IS NULL) AND run_at <= '${formatted_date}'`;

  console.log(query)
  return await executeQuery(query);
}


// Update task status
async function updateTaskStatus(status, id) {
  const query = "UPDATE ScheduledTasks SET STATUS = ? WHERE id = ?";
  await executeQuery(query, [status, id]);
}



async function UpdateNotification(ip,pingResult, status) {
  let current_date = new Date();
  let formatted_date = current_date.getFullYear() + '-'
    + (current_date.getMonth() + 1).toString().padStart(2, '0') + '-'
    + current_date.getDate().toString().padStart(2, '0') + ' '
    + current_date.getHours().toString().padStart(2, '0') + ':'
    + current_date.getMinutes().toString().padStart(2, '0') + ':'
    + current_date.getSeconds().toString().padStart(2, '0');


  const query = `UPDATE DevicesPing_Log 
SET Device_status = ?, 
    Running_status = ?, 
    updated_at = ?, 
    ping_response = ?, 
    status = ? 
WHERE device_ip = ? 
AND status = ? 
AND Running_at = (
    SELECT MAX(Running_at) 
    FROM DevicesPing_Log 
    WHERE device_ip = ? 
    AND status = ? 
    AND Running_at <= ?
);
`;

  await executeQuery(query, [pingResult.status ,status, formatted_date,pingResult.time,0, ip,1,ip,1,formatted_date]);
}

// Start the scheduler service
function startTaskScheduler() {
  cron.schedule("* * * * *", async () => {
    try {
      const tasks = await fetchTasksToRun();

      console.log('Running tasks', tasks.length);
      
      for (const task of tasks) {
        const { id, route, headers, body, ips } = task;

        try {
          await updateTaskStatus("Running", id);
          
          // Parse the IPs from the task
          const ipList = JSON.parse(ips || '[]');
          const parsedBody = JSON.parse(body || '{}');
          const taskIps = parsedBody.ips || ipList;

          if (!Array.isArray(taskIps) || taskIps.length === 0) {
            console.log(`Task ${id}: No IPs to ping`);
            await updateTaskStatus("Completed", id);
            continue;
          }

          console.log(`Task ${id}: Processing ${taskIps.length} IPs`);
          
          // Perform direct ping operations
          const pingResults = [];
          for (const ip of taskIps) {
            try {
              const pingResult = await performDirectPing(ip, parsedBody.numPings || 4);
              pingResults.push(pingResult);
              
              // Insert ping log
              await insertPingLog(ip, pingResult);
              
              // Update ping time and notification
              await updatePingTime(pingResult, ip);
              await UpdateNotification(ip, pingResult, "Completed");
              
            } catch (pingError) {
              console.error(`Error pinging IP ${ip}:`, pingError);
              const errorResult = { ip, error: pingError.message, alive: false, status: "Error" };
              pingResults.push(errorResult);
              await insertPingLog(ip, errorResult);
            }
          }

          await updateTaskStatus("Completed", id);
          console.log(`Task ${id} completed successfully. Processed ${pingResults.length} IPs`);
          
        } catch (error) {
          console.error(`Task ${id} failed:`, error);
          await updateTaskStatus("Failed", id);
        }
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });
}

// Add a cleanup job to remove old completed tasks (runs daily at midnight)
function startCleanupJob() {
  cron.schedule("0 0 * * *", async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const formatted_date = thirtyDaysAgo.getFullYear() + '-'
        + (thirtyDaysAgo.getMonth() + 1).toString().padStart(2, '0') + '-'
        + thirtyDaysAgo.getDate().toString().padStart(2, '0') + ' '
        + thirtyDaysAgo.getHours().toString().padStart(2, '0') + ':'
        + thirtyDaysAgo.getMinutes().toString().padStart(2, '0') + ':'
        + thirtyDaysAgo.getSeconds().toString().padStart(2, '0');
      
      const query = "DELETE FROM ScheduledTasks WHERE STATUS = 'Completed' AND run_at < ?";
      const result = await executeQuery(query, [formatted_date]);
      console.log(`Cleanup job: Removed ${result.affectedRows} old completed tasks`);
    } catch (error) {
      console.error('Cleanup job error:', error);
    }
  });
}

module.exports = { 
  startTaskScheduler,
  startCleanupJob,
  performDirectPing
};