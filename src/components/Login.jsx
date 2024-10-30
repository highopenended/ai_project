import React from "react"
import '../App.css'
function Login(){
    return (
        <>
            <h1>Log in</h1>
            <form className="flex content-center">
                <label >Enter USername</label>
                <input  type="text" placeholder="Enter Username" name="uname" required/>
            </form>
        </>
        
    )
}
export default Login