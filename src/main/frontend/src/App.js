import logo from './logo.svg';
import './App.css';
import Page from './page/Page';
import RouteMapPage from './page/RouteMapPage';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";


function App() {
  
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Page />} />
        <Route path="/route" element={<RouteMapPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
