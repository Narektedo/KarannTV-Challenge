import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import LadderPage from "./pages/LadderPage";

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
        <Route path="/" element={<HomePage />} /> 
        <Route path="/profiles/:user" element={<ProfilePage />} />
		<Route path="/ladder" element={<LadderPage />} />

			</Routes>
		</BrowserRouter>
	);
}