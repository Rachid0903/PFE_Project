import React, { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";
import { formatDate, formatTime } from "@/lib/dateUtils";

const DateTimeDisplay: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 text-gray-600 bg-gray-100 p-2 rounded-md">
      <div className="flex items-center">
        <Calendar className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">
          {formatDate(currentDateTime)}
        </span>
      </div>
      <div className="flex items-center">
        <Clock className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">
          {formatTime(currentDateTime)}
        </span>
      </div>
    </div>
  );
};

export default DateTimeDisplay;

