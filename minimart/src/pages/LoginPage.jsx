import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff, Facebook } from "lucide-react"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import api from "@/api/api"

const LoginPage = () => {
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Use `useNavigate` for navigation and `useLocation` to get the current location state
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check if the user is already logged in on mount
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData)) // Parse the stored user data
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 👇 Make sure your `api` instance is set up correctly
      const response = await api.post("/users/login", formData, {
        headers: { "Content-Type": "application/json" },
      });

      const data = response.data;

      console.log("Response Data:", data); // Log the response data to console

      if (data.token) {
        localStorage.setItem("token", data.token); // Store the token
        localStorage.setItem("user", JSON.stringify(data.user)); // Store the user data as a string

        console.log("Stored Token:", localStorage.getItem("token")); // Log token to console
        console.log("Stored User:", localStorage.getItem("user")); // Log user data to console

        setUser(data.user); // Set the user data in state
        toast.success("Login Successful");

        // Redirect logic
        const from = location.state?.from?.pathname || "/"; // Get the referrer or default to "/"
        navigate(from, { replace: true }); // Navigate to the referrer or home
      } else {
        setError(data.message || "Login failed");
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setError(error.response?.data?.message || error.message || "An error occurred.");
      toast.error(error.response?.data?.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };





  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">Login</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="example@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={!formData.email || !formData.password || isLoading}
              style={{ backgroundColor: "#0096FF", color: "#FFFFFF" }}>
              {isLoading ? "Logging in..." : "Login with Email"}
            </Button>

            <div className="relative my-6">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-2 text-sm text-gray-500">OR</span>
              </div>
            </div>

            
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-600">
          <p>
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default LoginPage

