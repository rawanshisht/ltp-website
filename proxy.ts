import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname === "/login") {
    if (role) {
      return NextResponse.redirect(new URL(`/${role.toLowerCase()}`, req.url));
    }
    return NextResponse.next();
  }

  if (!role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/parent") && role !== "PARENT") {
    return NextResponse.redirect(new URL(`/${role.toLowerCase()}`, req.url));
  }
  if (pathname.startsWith("/teacher") && role !== "TEACHER") {
    return NextResponse.redirect(new URL(`/${role.toLowerCase()}`, req.url));
  }
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL(`/${role.toLowerCase()}`, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
