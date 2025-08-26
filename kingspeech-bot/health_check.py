#!/usr/bin/env python3
"""
Simple health check endpoint for Render
"""

import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK')
        else:
            self.send_response(404)
            self.end_headers()

def start_health_server():
    """Start health check server on port 10000"""
    try:
        server = HTTPServer(('0.0.0.0', 10000), HealthCheckHandler)
        print("Health check server started on port 10000")
        server.serve_forever()
    except Exception as e:
        print(f"Health check server error: {e}")

if __name__ == "__main__":
    # Start health check server in a separate thread
    health_thread = threading.Thread(target=start_health_server, daemon=True)
    health_thread.start()
    
    # Import and run the main bot
    from kingspeech_bot import main
    main()
