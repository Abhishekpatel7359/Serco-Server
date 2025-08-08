const express = require("express");
const ping = require("ping");
const axios = require("axios");
const router = express.Router();

// Helper function to perform ping on a single IP
const performPing = async (ip, numPings = 4) => {
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
    const status =
        avg <= 100
            ? "Healthy"
            : avg > 100 && avg < 500
            ? "Delayed"
            : "Unresponsive";

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
};

// Batch Ping endpoint
router.post("/batch", async (req, res) => {
    const { ips, numPings = 4 } = req.body;

    if (!Array.isArray(ips) || ips.length === 0) {
        return res.status(400).json({ message: "IP list is required and must be an array" });
    }

    const results = [];
    for (const ip of ips) {
        try {
            const pingResult = await performPing(ip, numPings);
            results.push(pingResult);
            

            // Send result to insert or update route
            // const dbPayload = {
            //     queryType: "insert", // Or "update" based on your requirements
            //     table: "tbl_ping_log",
            //     values: pingResult, // Adjust based on the database schema
            // };

            // // Replace this URL with your API URL for insert/update
            // await axios.post("http://localhost:3000/api/db", dbPayload);



        } catch (error) {
            console.error(`Error pinging IP ${ip}:`, error.message);
            results.push({ ip, error: error.message });
        }
    }

    res.json({
        message: "Batch ping completed",
        results,
    });
});

// Single IP Ping endpoint
router.post("/single", async (req, res) => {
    try {
        const { ip, numPings = 4 } = req.body;

        if (!ip) {
            return res.status(400).json({ message: "IP address is required" });
        }

        // Perform the ping operation
        const pingResult = await performPing(ip, numPings);

        // Optionally, update or insert the result in the database
        // const dbPayload = {
        //     queryType: "insert", // Or "update"
        //     table: "tbl_ping_log",
        //     values: pingResult, // Adjust based on your database schema
        // };

        // // Replace with your database API endpoint
        // await axios.post("http://localhost:3000/api/db", dbPayload);

        // Return the result
        res.json({
            message: "Single IP ping completed",
            result: pingResult,
        });
    } catch (error) {
        console.error("Error pinging IP:", error.message);
        res.status(500).json({ message: "Error pinging IP", error: error.message });
    }
});


module.exports = router;
