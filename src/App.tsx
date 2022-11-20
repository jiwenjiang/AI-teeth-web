import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

const TeethReport = lazy(() => import("./pages/teeth/report"));

function App() {
  useEffect(() => {}, []);
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100vw",
              height: "100vh",
            }}
          ></div>
        }
      >
        <Routes>
          <Route path="/teeth-report" element={<TeethReport />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
