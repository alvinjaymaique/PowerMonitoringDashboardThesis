import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/PowerReadings.css';

const PowerReadings = () => {
    const [readings, setReadings] = useState([]);
    // VITE_API_URL=http://127.0.0.1:8000/api/; See the .env file in the frontend directory
    const apiURL = `${import.meta.env.VITE_API_URL}`   
    useEffect(() => {
        const fetchReadings = async () => {
            try {
                const response = await axios.get(apiURL);
                setReadings(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchReadings();
        // Fetch data every 5 seconds
        const interval = setInterval(fetchReadings, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="readings-container">
            <h2 className   ="readings-title">Power Readings</h2>
            <div className="table-container">
                <table className="readings-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Voltage (V)</th>
                            <th>Current (A)</th>
                            <th>Power (W)</th>
                            <th>Power Factor</th>
                            <th>Frequency (Hz)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {readings.map((reading) => (
                            <tr key={reading.id}>
                                <td>{new Date(reading.timestamp).toLocaleString()}</td>
                                <td>{reading.voltage}</td>
                                <td>{reading.current}</td>
                                <td>{reading.power}</td>
                                <td>{reading.power_factor}</td>
                                <td>{reading.frequency}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PowerReadings;