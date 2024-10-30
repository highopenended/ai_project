
import './App.css'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Home from './components/Home'
import About from './components/About'
import PrivateTab from './components/PrivateTab'
import Navbar from './components/Navbar'
import Login from './components/Login'

const PrivateRoutes = () => {
  let auth = {'token':true}
return (
    auth.token ? <Outlet/> : <Navigate to='/login'/>
  )
}


function App() {
  return (
    <BrowserRouter>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Login/>}></Route>
        <Route element={<PrivateRoutes/>}>
          <Route path="/home" element={<Home/>}></Route>
          <Route path="/about" element={<About/>}></Route>
          <Route path="/private" element={<PrivateTab/>}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
