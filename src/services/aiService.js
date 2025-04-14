import axios from 'axios';

// OpenRouter API anahtarınız 
const OPENROUTER_API_KEY = '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';
//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'
//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
//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
// Görev önerileri almak için yapay zeka servisini çağırır
export const getAISuggestions = async (userInput) => {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3-haiku:free',
        messages: [
          {
            role: 'system',
            content: `Sen bir kişisel gelişim ve alışkanlık uzmanısın. Kullanıcının hedeflerine uygun, bilimsel olarak kanıtlanmış, ölçülebilir ve gerçekçi alışkanlık önerileri sun.

SADECE aşağıdaki JSON formatında 6 adet öneri ver. Başka hiçbir açıklama veya metin ekleme, SADECE JSON dizisi döndür:
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

Öneriler kısa, net ve uygulanabilir olmalı. SADECE JSON formatında yanıt ver, başka hiçbir açıklama ekleme.`
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
        noprompttraining: true
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
      // JSON yanıtını daha güvenilir şekilde çıkar
      let jsonString = aiResponse;
      
      // Eğer yanıt JSON dışında metin içeriyorsa, sadece JSON kısmını çıkar
      const jsonStartIndex = aiResponse.indexOf('[');
      const jsonEndIndex = aiResponse.lastIndexOf(']') + 1;
      
      if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
        jsonString = aiResponse.substring(jsonStartIndex, jsonEndIndex);
      }
      
      // JSON'ı temizle - bazen modeller ekstra karakterler ekleyebilir
      jsonString = jsonString.replace(/```json|```/g, '').trim();
      
      console.log('İşlenecek JSON:', jsonString); // Hata ayıklama için
      
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
      console.error('Ham AI yanıtı:', aiResponse); // Tam yanıtı görmek için
      
      // JSON parse edilemezse, alternatif yöntemi kullan
      return parseAIResponseToSuggestions(aiResponse);
    }
    
  } catch (error) {
    console.error('AI API Hatası:', error);
    if (error.response) {
      // Sunucudan gelen yanıt
      console.error('Yanıt verisi:', error.response.data);
      console.error('Yanıt durumu:', error.response.status);
      console.error('Yanıt başlıkları:', error.response.headers);
    } else if (error.request) {
      // İstek yapıldı ama yanıt alınamadı
      console.error('İstek yapıldı ama yanıt alınamadı:', error.request);
    } else {
      // İstek oluşturulurken bir şeyler yanlış gitti
      console.error('Hata mesajı:', error.message);
    }
    return [];
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
