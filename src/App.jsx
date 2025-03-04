import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import PageTest from "./pages/pagetest";

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
        <Route path="/" element={<HomePage />} /> 
        <Route path="/profiles/:user" element={<ProfilePage />} />
		<Route path="/test" element={<PageTest />} />
			</Routes>
		</BrowserRouter>
	);
}