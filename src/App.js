import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CallToOne from './routes/CallToOne';
import CreateRoom from './routes/CreateRoom';
import Room from './routes/Room';
function App() {
	return (
		<BrowserRouter>
		<Routes>
		  <Route path="/" element={<CallToOne />} />
		  <Route path="/create-room/" element={<CreateRoom />} />
		  <Route path="/room/:roomID" element={<Room />} />
		</Routes>
	  </BrowserRouter>
	)
}

export default App