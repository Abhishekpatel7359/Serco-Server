const express = require("express");
const ping = require("ping");
const { formatSuccessResponse, formatErrorResponse } = require("../Utils/ResponseFormatter");
const { calculatePagination } = require("../Utils/Pagination");
const { validatePingRequest } = require("../Middleware/Validation");
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
router.post("/batch", validatePingRequest, async (req, res) => {
    const { ips, numPings = 4, page, limit } = req.body;

    if (!Array.isArray(ips) || ips.length === 0) {
        return res.status(400).json(formatErrorResponse("IP list is required and must be an array", 400));
    }

    try {
        const results = [];
        
        // Apply pagination if requested
        let paginatedIps = ips;
        let pagination = null;
        
        if (page || limit) {
            pagination = calculatePagination(page, limit, ips.length);
            const startIndex = pagination.offset;
            const endIndex = startIndex + pagination.itemsPerPage;
            paginatedIps = ips.slice(startIndex, endIndex);
        }

        for (const ip of paginatedIps) {
            try {
                const pingResult = await performPing(ip, numPings);
                results.push(pingResult);
            } catch (error) {
                console.error(`Error pinging IP ${ip}:`, error.message);
                results.push({ ip, error: error.message });
            }
        }

        const response = formatSuccessResponse(results, "Batch ping completed", pagination);
        res.json(response);
    } catch (error) {
        console.error("Batch ping error:", error);
        res.status(500).json(formatErrorResponse("Batch ping failed", 500, error.message));
    }
});

// Single IP Ping endpoint
router.post("/single", validatePingRequest, async (req, res) => {
    try {
        const { ip, numPings = 4 } = req.body;

        if (!ip) {
            return res.status(400).json(formatErrorResponse("IP address is required", 400));
        }

        // Perform the ping operation
        const pingResult = await performPing(ip, numPings);

        // Return the result
        const response = formatSuccessResponse(pingResult, "Single IP ping completed");
        res.json(response);
    } catch (error) {
        console.error("Error pinging IP:", error.message);
        res.status(500).json(formatErrorResponse("Error pinging IP", 500, error.message));
    }
});


module.exports = router;
