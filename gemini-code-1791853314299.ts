import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

// Límite de tamaño en JSON para prevenir ataques de carga útil excesiva
app.use(express.json({ limit: '10kb' })); 

// Control básico de peticiones por IP (Rate Limiting en memoria)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 30;

app.use('/api/', (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    requestCounts.set(ip, record);
  } else {
    record.count++;
    if (record.count > MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({ error: 'Demasiadas solicitudes. Por favor, espera un momento.' });
    }
  }
  next();
});

// API route para el asistente Wiggy
app.post('/api/wiggy-chat', async (req, res) => {
  try {
    const { messages, userProfile } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Validar longitud máxima de los mensajes
    for (const msg of messages) {
      if (typeof msg.content !== 'string' || msg.content.length > 2000) {
        return res.status(400).json({ error: 'Mensaje demasiado largo o inválido.' });
      }
    }

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const profileContext = userProfile
        ? `Datos del paciente: Nombre: ${userProfile.name || 'Paciente'}, Condición: ${userProfile.condition || 'General'}`
        : 'Condición del usuario: En proceso de rehabilitación.';

      const systemInstruction = `Eres Wiggy, asistente de Wiggle. Contexto: ${profileContext}`;
      
      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      });

      return res.json({ reply: response.text || '¡Estoy aquí para ayudarte!' });
    }

    return res.json({ reply: '*(Nota: Modo sin conexión o sin clave de API configurada)*' });
  } catch (error: any) {
    console.error('Error en wiggy-chat:', error);
    return res.status(500).json({ reply: 'Ocurrió un error al procesar tu consulta.' });
  }
});
```[cite: 1]

### Enlaces Externos Seguros (`ContactLocationModule.tsx`)
```tsx
<a
  href={getWhatsAppUrl()}
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#25D366] text-white font-extrabold text-sm shadow-lg"
>
  <MessageCircle className="w-5 h-5 fill-white" />
  <span>WhatsApp Directo: {WIGGLE_PHONE}</span>
</a>
```[cite: 1]

---

## 4. Recomendaciones para Mantener la App Segura a Futuro

* **Actualizaciones periódicas**: Ejecuta revisiones de dependencias (`npm audit`) de forma regular para mantener bibliotecas y frameworks actualizados frente a vulnerabilidades conocidas[cite: 1].
* **Protección de secretos**: Nunca guardes claves privadas o tokens de API en el código que se ejecuta en el navegador; manténlos siempre seguros en el entorno del servidor[cite: 1].
* **Validación de datos de usuario**: Verifica y filtra siempre cualquier texto o archivo multimedia que los usuarios suban o compartan en la plataforma[cite: 1].