import Login from "./Login"
import Signup from "./Signup"
import Books from "./Books"
import Tickets from "./Tickets"
import AuthorPortal from "./AuthorPortal"
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />}/>
      <Route path="/signup" element={<Signup/>}/>
      <Route path="/login" element={<Login/>}/>
      
      <Route element={<AuthorPortal/>}>
        <Route path="/books" element={<Books/>}/>
        <Route path="/tickets" element={<Tickets/>}/>
      </Route>
    </Routes>
    </BrowserRouter>
  )
}

export default App