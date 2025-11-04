import React from 'react';
import { Route,Routes,Router } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import EmailVerify from './pages/EmailVerify.jsx';
import { ToastContainer } from 'react-toastify';

const App = () => {
  return (
    <div>
     <ToastContainer/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/reset-password' element={<ResetPassword/>}/>
        <Route path='/email-verify' element={<EmailVerify/>}/>
      </Routes>
      </div>
  )
}

export default App