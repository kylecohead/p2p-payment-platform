import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div>
      <h1>Login Page</h1>
      <Link to="/home">
        <button>Go to Home Page</button>
      </Link>
    </div>
  );
}