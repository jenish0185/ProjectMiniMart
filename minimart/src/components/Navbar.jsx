import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppContext } from "../context/AppContext";

export function Navbar() {
  const { getTotalItems, searchQuery, setSearchQuery } = useContext(AppContext);
  const totalItems = getTotalItems();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLinkClick = (path) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-md"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">FM</span>
          </div>
          <span className="font-bold text-xl">FreshMart</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            to="/"
            className="text-sm font-medium hover:text-green-600 transition-colors"
          >
            Home
          </Link>
          <Link
            to="/categories"
            className="text-sm font-medium hover:text-green-600 transition-colors"
          >
            Categories
          </Link>
          <Link
            to="/cart"
            className="text-sm font-medium hover:text-green-600 transition-colors"
          >
            Cart
          </Link>
        </nav>

        {/* Search and Cart */}
        <div className="flex items-center space-x-4">
          {/* Search Bar (visible on medium screens and up) */}
          <div className="hidden sm:flex items-center relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-64"
            />
          </div>

          {/* Cart Icon */}
          <Link to="/cart">
            <Button variant="outline" size="icon" className="relative">
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center text-xs">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg p-4 space-y-4">
          <Link
            to="/"
            onClick={() => handleLinkClick("/")}
            className="block py-2 text-lg"
          >
            Home
          </Link>
          <Link
            to="/categories"
            onClick={() => handleLinkClick("/categories")}
            className="block py-2 text-lg"
          >
            Categories
          </Link>
          <Link
            to="/cart"
            onClick={() => handleLinkClick("/cart")}
            className="block py-2 text-lg"
          >
            Cart
          </Link>
        </div>
      )}
    </header>
  );
}