import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import PowerReadings from "../components/PowerReadings";
import Dashboard from "../components/Dashboard";
import SummaryReport from "../components/SummaryReport"; // Add this import
import "../css/MainContent.css";

const MainContent = () => {
  const [activeContent, setActiveContent] = useState("Dashboard");

  const renderContent = () => {
    switch (activeContent) {
      case "Dashboard":
        return <Dashboard />;
      case "powerReadings":
        return <PowerReadings />;
      case "summaryReport": // Add this case
        return <SummaryReport />;
      case "settings":
        return <h2>Settings Content</h2>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="main-content">
      <Sidebar onMenuClick={setActiveContent} />
      <div className="divider">
        <div className="content-area">{renderContent()}</div>
      </div>
    </div>
  );
};

export default MainContent;