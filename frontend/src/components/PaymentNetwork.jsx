import React, { useEffect, useRef } from "react";
import "./PaymentNetwork.css";

export default function PaymentNetwork() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Padding to keep nodes away from edges (accounts for glow effect)
    const padding = 30;

    // Network nodes (wallets/users)
    const nodes = [];
    const numNodes = 8;

    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: padding + Math.random() * (canvas.width - padding * 2),
        y: padding + Math.random() * (canvas.height - padding * 2),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: 6,
      });
    }

    // Payment particles
    const payments = [];

    class Payment {
      constructor(fromNode, toNode) {
        this.from = fromNode;
        this.to = toNode;
        this.progress = 0;
        this.speed = 0.01 + Math.random() * 0.015;
        this.size = 3;
        this.hue = 140 + Math.random() * 20; // Green spectrum
      }

      update() {
        this.progress += this.speed;
        if (this.progress > 1) {
          return false; // Remove this payment
        }
        return true;
      }

      draw(ctx) {
        const x = this.from.x + (this.to.x - this.from.x) * this.progress;
        const y = this.from.y + (this.to.y - this.from.y) * this.progress;

        // Draw payment particle with glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, this.size * 3);
        gradient.addColorStop(0, `hsla(${this.hue}, 70%, 60%, 0.8)`);
        gradient.addColorStop(0.5, `hsla(${this.hue}, 70%, 50%, 0.4)`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 40%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, this.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw core
        ctx.fillStyle = `hsl(${this.hue}, 80%, 70%)`;
        ctx.beginPath();
        ctx.arc(x, y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Spawn payments periodically
    const spawnPayment = () => {
      if (nodes.length < 2) return;
      const from = nodes[Math.floor(Math.random() * nodes.length)];
      let to = nodes[Math.floor(Math.random() * nodes.length)];
      // Make sure from and to are different
      while (to === from && nodes.length > 1) {
        to = nodes[Math.floor(Math.random() * nodes.length)];
      }
      payments.push(new Payment(from, to));
    };

    let lastSpawn = 0;
    const spawnInterval = 400; // milliseconds

    // Animation loop
    const animate = (timestamp) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new payments
      if (timestamp - lastSpawn > spawnInterval) {
        spawnPayment();
        lastSpawn = timestamp;
      }

      // Update and draw nodes
      nodes.forEach((node) => {
        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges with padding
        if (node.x < padding || node.x > canvas.width - padding) {
          node.vx *= -1;
          node.x = Math.max(padding, Math.min(canvas.width - padding, node.x));
        }
        if (node.y < padding || node.y > canvas.height - padding) {
          node.vy *= -1;
          node.y = Math.max(padding, Math.min(canvas.height - padding, node.y));
        }

        // Draw node glow
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.radius * 3
        );
        gradient.addColorStop(0, "rgba(68, 173, 114, 0.3)");
        gradient.addColorStop(1, "rgba(68, 173, 114, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw node
        ctx.fillStyle = "#44ad72";
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw node outline
        ctx.strokeStyle = "#5ce87d";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw connections between nearby nodes
      ctx.strokeStyle = "rgba(68, 173, 114, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 200) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Update and draw payments
      for (let i = payments.length - 1; i >= 0; i--) {
        if (!payments[i].update()) {
          payments.splice(i, 1);
        } else {
          payments[i].draw(ctx);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate(0);

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="payment-network-container">
      <canvas ref={canvasRef} className="payment-network-canvas" />
    </div>
  );
}
