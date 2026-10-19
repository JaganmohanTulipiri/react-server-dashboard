import React from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ServerPage() {
  const { name } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold mb-4">{name}</h1>
      <p className="text-gray-600 mb-8">This is the page for {name}. Add custom actions or data here.</p>
      <button onClick={()=>navigate("/dashboard")} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md">Back to Dashboard</button>
    </div>
  );
}