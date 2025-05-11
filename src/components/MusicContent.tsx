import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface MusicContentProps {
  header: string | null;
  content: string | string[];
  fontSize: number;
}

function splitIntoTwoLines(content: string | string[]): string[] {
  console.log('Received content:', content);
  
  // Преобразуем content в массив строк
  let items: string[];
  if (typeof content === 'string') {
    items = [content];
  } else if (Array.isArray(content)) {
    items = content;
  } else {
    console.error('Invalid content type:', typeof content);
    return ['', ''];
  }
  
  console.log('Processed items:', items);
  
  if (items.length === 0) return ['', ''];
  if (items.length === 1) return [items[0], ''];

  // Находим середину массива
  const midPoint = Math.ceil(items.length / 2);
  
  // Собираем две строки, соединяя элементы пробелами
  const firstLine = items.slice(0, midPoint).join(' ');
  const secondLine = items.slice(midPoint).join(' ');
  
  console.log('Split lines:', [firstLine, secondLine]);

  return [firstLine, secondLine];
}

export default function MusicContent({ header, content, fontSize: initialFontSize }: MusicContentProps) {
  const [currentFontSize, setCurrentFontSize] = useState(initialFontSize);
  const containerRef = useRef<HTMLDivElement>(null);
  const testRef = useRef<HTMLDivElement>(null);

  if (!content) return null;

  console.log('Content in component:', content);
  const lineArray = splitIntoTwoLines(content);
  console.log('Final line array:', lineArray);

  useEffect(() => {
    const adjustFontSize = () => {
      if (!containerRef.current || !testRef.current) return;

      const container = containerRef.current;
      let fontSize = initialFontSize * 1.8;
      let fits = false;

      // Создаем временный элемент для измерения
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.whiteSpace = 'nowrap';
      document.body.appendChild(tempDiv);

      while (!fits && fontSize > 18) {
        tempDiv.style.fontSize = `${fontSize}px`;
        
        // Проверяем каждую строку
        const line1Width = (() => {
          tempDiv.textContent = lineArray[0];
          return tempDiv.offsetWidth;
        })();
        
        const line2Width = (() => {
          tempDiv.textContent = lineArray[1];
          return tempDiv.offsetWidth;
        })();

        if (line1Width <= container.clientWidth && line2Width <= container.clientWidth) {
          fits = true;
        } else {
          fontSize -= 1;
        }
      }

      document.body.removeChild(tempDiv);
      setCurrentFontSize(fontSize);
    };

    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [content, initialFontSize, lineArray]);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full text-white"
    >
      {header && (
        <motion.span
          className="block text-[70%] mb-4 font-bold tracking-wide"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {header}
        </motion.span>
      )}
      <motion.div 
        ref={testRef}
        className="flex flex-col items-center space-y-2"
        style={{ fontSize: `${currentFontSize}px` }}
      >
        {lineArray.map((line, index) => (
          <motion.span
            key={index}
            className="block text-center whitespace-nowrap"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 + index * 0.05 }}
          >
            {line}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}