

import { BrowserRouter, Routes, Route } from "react-router-dom";
import MyPageWrapper from "./page/mypage/MyPageWrapper.js";
import Page from './page/Page';
import RouteMapPage from './page/RouteMapPage';
import OilPrice from "./page/OilPrice.js";



function App() {
  
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Page />} />
        <Route path="/route" element={<RouteMapPage />} />
        <Route path="/mypage" element={<MyPageWrapper />} />
        <Route path="/oilPrice" element={<OilPrice />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;