import AuthorNavbar from "./AuthorNavbar"
import {Outlet} from "react-router-dom";

export default function AuthorPortal() {
    return (
        <>
        <AuthorNavbar/>
        <Outlet/>
        </>
    )
}