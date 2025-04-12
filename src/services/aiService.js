import axios from 'axios';

// OpenRouter API anahtarınız
const OPENROUTER_API_KEY = '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';

// Görev önerileri almak için yapay zeka servisini çağırır
export const getAISuggestions = async (userInput) => {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: `Sen bir kişisel gelişim ve alışkanlık uzmanısın. Kullanıcının hedeflerine uygun, bilimsel olarak kanıtlanmış, ölçülebilir ve gerçekçi alışkanlık önerileri sun.

TAM OLARAK aşağıdaki JSON formatında 6 adet öneri ver:
[
  {
    "title": "Alışkanlık başlığı",
    "category": "Kategori adı",
    "icon": "icon-adı",
    "description": "Bu alışkanlığın faydaları ve nasıl uygulanacağı hakkında kısa açıklama"
  },
  ...
]

Kategori seçenekleri: Sağlık, Fitness, Beslenme, Zihinsel Sağlık, Kişisel Gelişim, Sosyal, Üretkenlik, Finans

Icon seçenekleri (kategori ile uyumlu olmalı):
- Sağlık: heart-pulse, hospital, pill, shield-heart
- Fitness: dumbbell, run, bike, swim, weight-lifter
- Beslenme: food-apple, food, nutrition, silverware-fork-knife
- Zihinsel Sağlık: meditation, brain, emoticon-happy-outline, mindfulness
- Kişisel Gelişim: book-open-variant, school, lightbulb-on, head-cog
- Sosyal: account-group, handshake, chat, forum
- Üretkenlik: clock-time-four, calendar-check, checkbox-marked-circle, timer
- Finans: cash, bank, credit-card, chart-line

Öneriler kısa, net ve uygulanabilir olmalı. Sadece JSON formatında yanıt ver, başka açıklama ekleme.`
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dutymanagement.app',
          'X-Title': 'Duty Management App'
        }
      }
    );

    // API yanıtını işle
    const aiResponse = response.data.choices[0].message.content;
    
    try {
      // JSON yanıtını parse et
      const jsonStart = aiResponse.indexOf('[');
      const jsonEnd = aiResponse.lastIndexOf(']') + 1;
      const jsonString = aiResponse.substring(jsonStart, jsonEnd);
      
      const suggestions = JSON.parse(jsonString);
      
      // Her öneri için benzersiz ID ekle ve source olarak 'ai' belirt
      return suggestions.map((suggestion, index) => ({
        ...suggestion,
        id: `ai-suggestion-${Date.now()}-${index}`,
        frequency: 'Günlük',
        completed: false,
        source: 'ai'
      }));
    } catch (error) {
      console.error('JSON parse hatası:', error);
      // JSON parse edilemezse, alternatif yöntemi kullan
      return parseAIResponseToSuggestions(aiResponse);
    }
    
  } catch (error) {
    console.error('AI yanıtı alınamadı:', error);
    throw new Error('Yapay zekadan öneri alınamadı.');
  }
};

// Yedek plan: AI yanıtını görev önerilerine dönüştürür (JSON parse edilemezse)
const parseAIResponseToSuggestions = (aiResponse) => {
  try {
    // Basit bir örnek: AI yanıtını satırlara böl ve her satırı bir görev olarak yorumla
    const lines = aiResponse.split('\n').filter(line => line.trim() !== '');
    
    // En fazla 6 öneri al
    const limitedLines = lines.slice(0, 6);
    
    // Her satırı bir görev önerisi olarak formatla
    return limitedLines.map((line, index) => {
      // Kategori ve başlığı ayır (eğer varsa)
      let title = line;
      let category = 'Genel';
      let icon = 'star-outline';
      let description = '';
      
      if (line.includes(':')) {
        const parts = line.split(':');
        category = parts[0].trim();
        title = parts[1].trim();
        
        // Kategori bazında ikon seç
        icon = getCategoryIcon(category);
      }
      
      return {
        id: `ai-suggestion-${Date.now()}-${index}`,
        title,
        category,
        icon,
        description: description || `${title} alışkanlığı sağlığınız için faydalıdır.`,
        frequency: 'Günlük',
        completed: false,
        source: 'ai'
      };
    });
  } catch (error) {
    console.error('AI yanıtı işlenirken hata oluştu:', error);
    return [];
  }
};

// Kategori bazında ikon seçimi
const getCategoryIcon = (category) => {
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes('sağlık')) return 'heart-pulse';
  if (lowerCategory.includes('fitness') || lowerCategory.includes('egzersiz')) return 'dumbbell';
  if (lowerCategory.includes('beslenme') || lowerCategory.includes('yemek')) return 'food-apple';
  if (lowerCategory.includes('zihinsel') || lowerCategory.includes('mental')) return 'brain';
  if (lowerCategory.includes('kişisel') || lowerCategory.includes('gelişim')) return 'book-open-variant';
  if (lowerCategory.includes('sosyal')) return 'account-group';
  if (lowerCategory.includes('üretkenlik') || lowerCategory.includes('verimlilik')) return 'clock-time-four';
  if (lowerCategory.includes('finans') || lowerCategory.includes('para')) return 'cash';
  
  return 'star-outline'; // Varsayılan ikon
};
