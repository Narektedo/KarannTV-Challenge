import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
        <Route path="/" element={<HomePage />} /> 
        <Route path="/profiles/:user" element={<ProfilePage />} />

			</Routes>
		</BrowserRouter>
	);
}