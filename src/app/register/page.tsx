import { redirect } from "next/navigation";

export default function RegisterPage() {
    redirect("/login?error=Registration%20is%20currently%20managed%20through%20the%20whitelist.");
}
