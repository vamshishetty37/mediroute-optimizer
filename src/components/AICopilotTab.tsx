import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User } from 'lucide-react';
import { OptimizationResult, Supply } from '../types';

// System prompt to configure the assistant's behavior
const SYSTEM_INSTRUCTION = `You are the MedRoute Copilot, an AI assistant for a medical logistics optimization dashboard.
You help users understand the results of the TSP (Traveling Salesperson Problem) and 0/1 Knapsack optimization algorithms.

Context:
- TSP: Solves for the shorest route through multiple hospitals.
- Knapsack: Solves for the most valuable set of supplies that fit in a vehicle's capacity.
- 2-Opt: A local search algorithm used to improve the initial Nearest Neighbor TSP route.

Your tone should be professional, technical, yet helpful. Use data from the provided context to answer questions precisely.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AICopilotTab({ result, allSupplies }: { result: OptimizationResult; allSupplies: Supply[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use the server-side proxy endpoint
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `
Current Optimization Data:
- Vehicle Capacity: ${result.knapsack?.capacity || '0'} kg
- All Available Supplies: ${allSupplies.map(s => `${s.name} (${s.weight}kg, ${s.value}pts)`).join(', ')}
- Items Actually Packed: ${result.knapsack?.packedItems.map(i => i.name).join(', ') || 'N/A'}
- Items Skipped (Sub-optimal or Choice): ${result.knapsack?.skippedItems.map(i => i.name).join(', ') || 'None'}
- Items Not Feasible (Exceed Capacity): ${result.knapsack?.infeasibleItems.map(i => i.name).join(', ') || 'None'}
- Total Value Achieved: ${result.knapsack?.totalValue || '0'}
- Weight Used: ${result.knapsack?.totalWeight || '0'} kg
- Utilization: ${result.knapsack?.utilization.toFixed(1) || '0'}%

- TSP Route: ${result.tsp?.route.map(s => s.hospital.name).join(' -> ') || 'N/A'}
- Total Distance: ${result.tsp?.totalDistance.toFixed(2) || '0'} km
- TSP Improvement: ${result.tsp?.improvement.toFixed(2) || '0'}%

User Question: ${text}
`,
          systemInstruction: SYSTEM_INSTRUCTION
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.text || "I'm sorry, I couldn't process that request." 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to AI service. Please ensure your API key is configured on the server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Explain the knapsack packing decisions: which items were chosen and why, considering their value, weight, and capacity.",
    "Explain the optimal route step-by-step.",
    "What trade-offs did the optimizer make?",
    "How close is 2-opt to the brute-force optimum?",
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <div className="scannable-header !mb-0">MEDROUTE COPILOT • GEMINI 3 FLASH</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="space-y-4">
            <p className="text-slate-500 leading-relaxed text-[13px]">
              Ask anything about the current plan. The assistant receives the optimizer output as structured context.
            </p>
            <div className="grid gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="text-left p-3 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-blue-400 hover:bg-blue-50 transition-all text-xs flex items-center gap-2 group"
                >
                  <Sparkles size={14} className="text-blue-500 group-hover:scale-110 transition-transform" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-xl text-[13px] ${
              m.role === 'user' 
                ? 'bg-blue-700 text-white' 
                : 'bg-white border border-slate-200 text-slate-800'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-50 font-bold uppercase text-[9px] tracking-widest">
                {m.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                {m.role}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-500" />
              <span className="text-xs text-slate-400 font-medium">Processing logic...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Query optimizer output..."
            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
