import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CallToOne from './routes/CallToOne';
import CreateRoom from './routes/CreateRoom';
import Room from './routes/Room';
import { UserProvider } from './context/UserContext';

function App() {
	return (
		<UserProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<CreateRoom />} />
					<Route path="/call-to-one" element={<CallToOne />} />
					<Route path="/room/:roomID" element={<Room />} />
				</Routes>
			</BrowserRouter>
		</UserProvider>
	);
}

export default App;