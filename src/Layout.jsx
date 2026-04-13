import React from "react";
import { ICON_URL } from "./components/data/courseData";

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <style>{`
        :root {
          --brand-red: #E53935;
          --brand-orange: #F9A825;
          --brand-blue: #0B5394;
          --brand-dark: #1A1A2E;
        }
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .brand-gradient { background: linear-gradient(135deg, #E53935 0%, #F9A825 100%); }
      `}</style>
      {children}
    </div>
  );
}