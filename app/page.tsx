'use client';

import { useState } from 'react';

const products = [
  { id: 'pro_monthly', name: 'Pro [Monthly]', price: 40 },
  { id: 'hero_monthly', name: 'Hero [Monthly]', price: 70 },
  { id: 'legend_monthly', name: 'Legend [Monthly]', price: 150 },
  { id: 'god_monthly', name: 'God [Monthly]', price: 180 },
  { id: 'pro', name: 'Pro [Permanent]', price: 150 },
  { id: 'hero', name: 'Hero [Permanent]', price: 220 },
  { id: 'legend', name: 'Legend [Permanent]', price: 270 },
  { id: 'god', name: 'God [Permanent]', price: 300 },
  { id: 'coins_1100', name: '1,100 Coins', price: 60 },
  { id: 'coins_2400', name: '2,400 Coins', price: 115 },
  { id: 'rare_key_5x', name: 'Rare Key 5x', price: 120 },
  { id: 'epic_key_5x', name: 'Epic Key 5x', price: 150 },
];

export default function Home() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  const buyProduct = async (productId: string, productName: string) => {
    if (!username.trim()) {
      alert('Pehle Minecraft username likho');
      return;
    }

    setLoading(true);
    setMessage('');
    setQrUrl('');

    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          username: username.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage(`Order ban gaya! Amount: ₹${data.amount}`);
        if (data.qrUrl) {
          setQrUrl(data.qrUrl);
        } else if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } else {
        setMessage(data.error || 'Kuch error aa gaya');
      }
    } catch (err) {
      setMessage('Server error. Thodi der baad try karo.');
    }

    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#050505', 
      color: 'white', 
      fontFamily: 'Arial',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', color: '#ff7900', marginBottom: '10px' }}>
          MINE MC STORE
        </h1>
        <p style={{ textAlign: 'center', color: '#aaa', marginBottom: '30px' }}>
          Automatic Delivery • Offline Support
        </p>

        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <input
            type="text"
            placeholder="Minecraft Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              padding: '12px 16px',
              width: '100%',
              maxWidth: '300px',
              borderRadius: '8px',
              border: '1px solid #ff7900',
              background: '#111',
              color: 'white',
              fontSize: '16px'
            }}
          />
        </div>

        {message && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '20px', 
            padding: '12px',
            background: '#1a1a1a',
            borderRadius: '8px',
            color: '#ff7900'
          }}>
            {message}
          </div>
        )}

        {qrUrl && (
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <p>QR Code se payment karo:</p>
            <img src={qrUrl} alt="UPI QR" style={{ maxWidth: '250px', borderRadius: '12px' }} />
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
          gap: '15px' 
        }}>
          {products.map((p) => (
            <div key={p.id} style={{
              background: '#111',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <h3 style={{ margin: '0 0 8px 0' }}>{p.name}</h3>
              <p style={{ color: '#ff7900', fontSize: '22px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
                ₹{p.price}
              </p>
              <button
                onClick={() => buyProduct(p.id, p.name)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#ff7900',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Please wait...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  }
