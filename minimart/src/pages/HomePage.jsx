import React, { useState } from "react";
import { Star, Truck, Shield, Clock } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { products } from "../lib/products";
import { useApp } from "../context/AppContext";

// Sample product data
const featuredProducts = products.slice(0, 6);
const categories = [
  { name: "Fruits & Vegetables", icon: "🥕", count: 150 },
  { name: "Dairy & Eggs", icon: "🥛", count: 45 },
  { name: "Meat & Seafood", icon: "🥩", count: 80 },
  { name: "Bakery", icon: "🍞", count: 35 },
  { name: "Beverages", icon: "🥤", count: 120 },
  { name: "Snacks", icon: "🍿", count: 200 },
  { name: "Frozen Foods", icon: "🧊", count: 90 },
  { name: "Household", icon: "🧽", count: 75 },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { addToCart } = useApp();

  const handleProductClick = (product) => {
    // If you're using context or global state to pass selected product:
    // setSelectedProduct(product);
    // setCurrentPage("product");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-50 to-blue-50 py-20">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Fresh Groceries
                <span className="text-green-600"> Delivered</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Get the freshest produce, quality meats, and everyday essentials delivered to your doorstep in under 2 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  Shop Now
                </Button>
                <Button size="lg" variant="outline">
                  View Deals
                </Button>
              </div>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Truck className="h-4 w-4" />
                  <span>Free delivery over $50</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>2-hour delivery</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="/placeholder.svg?height=500&width=600"
                alt="Fresh groceries"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
            <p className="text-muted-foreground">Find everything you need in our organized categories</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{category.icon}</div>
                  <h3 className="font-semibold mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count} items</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-muted-foreground">Hand-picked favorites and best deals</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="relative">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    {product.discount && (
                      <Badge className="absolute top-2 left-2 bg-red-500">{product.discount}% OFF</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{product.category}</Badge>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{product.rating}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-green-600">${product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">${product.originalPrice}</span>
                      )}
                    </div>
                    <Button size="sm" onClick={() => addToCart(product)}>
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground">Get your groceries delivered in 2 hours or less</p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Guarantee</h3>
              <p className="text-muted-foreground">100% satisfaction guarantee on all products</p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-muted-foreground">Customer support available around the clock</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-green-100 mb-8">Get the latest deals and offers delivered to your inbox</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              placeholder="Enter your email"
              className="bg-white text-black px-4 py-2 rounded-md focus:outline-none"
            />
            <Button variant="secondary">Subscribe</Button>
          </div>
        </div>
      </section>
    </div>
  );
}