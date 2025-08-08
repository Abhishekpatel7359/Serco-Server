const cron = require("node-cron");
const axios = require("axios");
const { executeQuery } = require("../Services/CrudService");

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



  const query = `SELECT * FROM ScheduledTasks WHERE STATUS = 'SCHEDULED' AND  run_at <= '${formatted_date}'`;

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
    const tasks = await fetchTasksToRun();

    console.log('Running tasks', tasks)
    tasks.forEach(async (task) => {
      const { id, route, headers, body } = task;



      try {
        const response = await axios.post(route, JSON.parse(body), {
          headers: JSON.parse(headers),
        });

        const { ips } = JSON.parse(body);


        const data = response.data.results;


        console.log("Data",data)
        console.log("ips",ips)
        // Process results for each IP
        ips.forEach(async (ip, index) => {
          const pingResult = data[index] || "No result"; // Adjust based on API response format
          await insertPingLog(ip, pingResult);
          // await updatePingTime(pingResult, ip);
          UpdateNotification(ip,pingResult, "Completed");

        });

        await updateTaskStatus("Completed", id,);
        console.log(`Task ${id} executed successfully.`);
      } catch (error) {
        console.error(`Task ${id} failed:`, error);
        
        console.log(`Task ${id} failed:`, error);
        
        await updateTaskStatus(id, "Failed");
      }
    });
  });
}

module.exports = { startTaskScheduler };
