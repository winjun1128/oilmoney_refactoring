import { BrowserRouter, Routes, Route } from "react-router-dom";
import MyPageWrapper from "./page/mypage/MyPageWrapper.js";
import Page from './page/Page';
import RouteMapPage from './page/RouteMapPage';



function App() {
  
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Page />} />
        <Route path="/route" element={<RouteMapPage />} />
        {/* <Route path="/mypage" element={<MyPageWrapper />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
