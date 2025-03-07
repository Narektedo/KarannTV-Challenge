import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import PageTest from "./pages/pagetest";
import PageTestWollows from "./pages/pagetestwollows";
import AccountPage from "./pages/AccountPage";

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
        <Route path="/" element={<HomePage />} /> 
        <Route path="/profiles/:user" element={<ProfilePage />} />
		<Route path="/test" element={<PageTest />} />
		<Route path="/test2/:gameName/:tagLine" element={<PageTestWollows />} />
		<Route path="/profiles/:gameName/:tagLine" element={<AccountPage />} />
			</Routes>
		</BrowserRouter>
	);
}