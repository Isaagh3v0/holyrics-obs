import { motion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";

interface BibleContentProps {
  header: string | null;
  content: string[];
  fontSize: number;
}

const removeNumbers = (text: string): string => text.replace(/[0-9]/g, '');

const useTextMeasurement = () => {
  const measureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    document.body.appendChild(div);
    measureRef.current = div;

    return () => {
      document.body.removeChild(div);
    };
  }, []);

  return measureRef;
};

const useOptimalFontSize = (
  content: string[],
  containerRef: React.MutableRefObject<HTMLDivElement | null>,
  header: string | null
) => {
  const [textSize, setTextSize] = useState(14);
  const [lines, setLines] = useState<string[]>([]);
  const measureRef = useTextMeasurement();

  const calculateLines = useCallback((text: string, maxWidth: number, fontSize: number): string[] => {
    if (!measureRef.current) return [''];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine: string[] = [];

    measureRef.current.style.fontSize = `${fontSize}px`;
    measureRef.current.style.width = `${maxWidth}px`;

    for (const word of words) {
      currentLine.push(word);
      measureRef.current.textContent = currentLine.join(' ');
      
      if (measureRef.current.offsetWidth > maxWidth) {
        if (currentLine.length === 1) {
          lines.push(currentLine.join(' '));
          currentLine = [];
        } else {
          currentLine.pop();
          lines.push(currentLine.join(' '));
          currentLine = [word];
        }
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }

    return lines;
  }, [measureRef]);

  useEffect(() => {
    const updateSizes = () => {
      if (!containerRef.current || !measureRef.current) return;
      
      const container = containerRef.current;
      const containerHeight = container.clientHeight;
      const containerWidth = container.clientWidth;
      const maxWidth = containerWidth * 0.9;
      const maxHeight = containerHeight * 0.8;
      
      const fullText = content.join(' ');
      
      // Binary search for optimal font size
      let minSize = 10;
      let maxSize = Math.min(containerHeight * 0.14, containerWidth * 0.09);
      let bestSize = minSize;
      let bestLines: string[] = [];

      while (minSize <= maxSize) {
        const midSize = Math.floor((minSize + maxSize) / 2);
        const testLines = calculateLines(fullText, maxWidth, midSize);
        const lineHeight = midSize * 1.3;
        const totalHeight = lineHeight * testLines.length;

        if (totalHeight <= maxHeight) {
          bestSize = midSize;
          bestLines = testLines;
          minSize = midSize + 1;
        } else {
          maxSize = midSize - 1;
        }
      }

      if (header) {
        bestSize *= 0.55;
      }

      bestSize = Math.max(bestSize, 14);
      setTextSize(bestSize);
      setLines(bestLines);
    };

    updateSizes();

    const resizeObserver = new ResizeObserver(updateSizes);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [content, header, containerRef, calculateLines]);

  return { textSize, lines };
};

const VerseHeader = ({ header, textSize }: { header: string; textSize: number }) => (
  <motion.div
    className="text-center mb-2"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7 }}
  >
    <motion.span
      className="block font-light tracking-wider text-gray-200"
      style={{
        fontSize: `${textSize * 0.7}px`,
        lineHeight: '1.2',
        letterSpacing: '0.05em'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      {header}
    </motion.span>
  </motion.div>
);

const VerseContent = ({ lines, textSize }: { lines: string[]; textSize: number }) => (
  <div className="flex-1 flex flex-col justify-center">
    <div className="flex flex-col items-center space-y-6">
      {lines.map((line, index) => (
        <motion.div
          key={index}
          className="text-center font-light"
          style={{
            fontSize: `${textSize}px`,
            lineHeight: '1.3',
            maxWidth: '90%',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 + index * 0.1 }}
        >
          {removeNumbers(line)}
        </motion.div>
      ))}
    </div>
  </div>
);

export default function BibleContent({ header, content }: BibleContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { textSize, lines } = useOptimalFontSize(content, containerRef, header);

  if (!content) return null;

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full h-full text-white"
    >
      <motion.div
        className="w-[95%] h-[95%] max-w-5xl rounded-2xl p-6 shadow-2xl flex flex-col"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)'
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {header && <VerseHeader header={header} textSize={textSize} />}
        <VerseContent lines={lines} textSize={textSize} />
      </motion.div>
    </div>
  );
}