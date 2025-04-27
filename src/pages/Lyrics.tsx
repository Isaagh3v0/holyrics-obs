import { useContext, useEffect, useState, useRef } from "react";
import { SocketContext } from "../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import MusicContent from "../components/MusicContent";
import React from "react";

interface TextData {
  type: "MUSIC" | "EMPTY";
  header: string | null;
  content: string | any; // Изменено для поддержки разных типов данных
}

export default function Lyrics() {
  const { socket } = useContext(SocketContext);
  const [textData, setTextData] = useState<TextData>({
    type: "MUSIC",
    header: null,
    content: "",
  });
  const [fontSize, setFontSize] = useState(35);
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef<HTMLDivElement>(null);
  const invisibleRef = useRef<HTMLDivElement>(null);

  // WebSocket event listener
  useEffect(() => {
    if (!socket) {
      console.error("WebSocket не инициализирован");
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        console.log("Получено сообщение:", event.data);
        const data = JSON.parse(event.data);
        
        // Проверяем, что данные имеют ожидаемую структуру
        if (!data || (data.type !== "MUSIC" && data.type !== "EMPTY")) {
          console.log("Получен неподдерживаемый тип сообщения:", data?.type);
          setVisible(false);
          return;
        }
        
        // Преобразуем content в строку, если это не строка
        const processedData: TextData = {
          ...data,
          content: typeof data.content === 'string' ? data.content : 
                   data.content === null || data.content === undefined ? '' : 
                   String(data.content)
        };
        
        // Обновляем данные
        setTextData(processedData);
        
        // Управляем видимостью
        if (processedData.type === "EMPTY") {
          setVisible(false);
        } else {
          const isEmpty = !processedData.content || processedData.content.trim() === "";
          setVisible(!isEmpty);
        }
        
        console.log("Данные текста обновлены:", processedData);
      } catch (error) {
        console.error("Ошибка при обработке сообщения WebSocket:", error);
      }
    };

    // Добавляем обработчик сообщений
    socket.addEventListener("message", handleMessage);
    
    // Проверка состояния соединения
    console.log("Состояние WebSocket:", socket.readyState);
    
    // Добавляем обработчик для отслеживания состояния соединения
    const handleOpen = () => console.log("WebSocket соединение установлено");
    const handleClose = () => console.log("WebSocket соединение закрыто");
    const handleError = (error: Event) => console.error("Ошибка WebSocket:", error);
    
    socket.addEventListener("open", handleOpen);
    socket.addEventListener("close", handleClose);
    socket.addEventListener("error", handleError);

    return () => {
      // Удаляем все обработчики при размонтировании
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("close", handleClose);
      socket.removeEventListener("error", handleError);
    };
  }, [socket]);

  // Переключение полноэкранного режима
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) =>
        console.error(`Ошибка перехода в полноэкранный режим: ${err.message}`)
      );
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  // Функция настройки размера текста
  const adjustTextSize = () => {
    if (!visibleRef.current || !invisibleRef.current || !containerRef.current) {
      console.log("Ссылки на DOM-элементы не готовы");
      return;
    }

    const invisibleDiv = invisibleRef.current;
    const container = containerRef.current;
    const maxSize = 100;
    const minSize = 10;

    invisibleDiv.style.fontSize = `${maxSize}px`;

    if (
      invisibleDiv.scrollHeight > container.clientHeight ||
      invisibleDiv.scrollWidth > container.clientWidth
    ) {
      let min = minSize;
      let max = maxSize;
      let currentSize = fontSize;

      while (min <= max) {
        const mid = Math.floor((min + max) / 2);
        invisibleDiv.style.fontSize = `${mid}px`;

        if (
          invisibleDiv.scrollHeight > container.clientHeight ||
          invisibleDiv.scrollWidth > container.clientWidth
        ) {
          max = mid - 1;
        } else {
          min = mid + 1;
          currentSize = mid;
        }
      }
      
      console.log("Установлен размер шрифта:", Math.min(max, currentSize));
      setFontSize(Math.min(max, currentSize));
    } else {
      console.log("Установлен максимальный размер шрифта:", maxSize);
      setFontSize(maxSize);
    }
  };

  // Подстройка размера текста при изменении текста или размера окна
  useEffect(() => {
    console.log("Текст или видимость изменились, пересчитываем размер");
    
    // Используем таймаут для гарантии обновления DOM перед измерениями
    if (visible) {
      const timer = setTimeout(() => {
        adjustTextSize();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [textData, visible]);

  // Обработчик изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      if (visible) {
        console.log("Размер окна изменился, пересчитываем размер текста");
        adjustTextSize();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [visible]);

  // Рендеринг невидимого контента для расчета размера текста
  const renderInvisibleContent = () => {
    if (textData.type === "EMPTY" || !textData.content) return null;

    // Убедимся, что content точно строка
    const contentStr = typeof textData.content === 'string' 
      ? textData.content 
      : String(textData.content);

    return (
      <>
        {textData.header && (
          <span className="block text-[70%] mb-4">{textData.header}</span>
        )}
        <div>
          {contentStr.split("\n").map((line, index) => (
            <React.Fragment key={`invisible-${index}`}>
              {line}
              {index < contentStr.split("\n").length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      </>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key="screen-container"
          ref={containerRef}
          className="w-screen h-screen bg-gradient-to-b from-black/70 to-blue-900/70 overflow-hidden relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          onDoubleClick={toggleFullscreen}
        >
          <motion.div
            key="text-container"
            className="w-full h-full flex items-center justify-center text-white text-center"
          >
            <motion.div
              ref={visibleRef}
              className="font-arial pt-4 px-4 w-full h-full flex flex-col items-center justify-center text-shadow-lg glow"
              key={`content-${JSON.stringify(textData.content)}`} // Используем JSON.stringify для любого типа данных
            >
              <MusicContent
                header={textData.header}
                content={typeof textData.content === 'string' ? textData.content : String(textData.content)}
                fontSize={fontSize}
              />
            </motion.div>
          </motion.div>
          <div
            ref={invisibleRef}
            className="absolute invisible font-arial pt-4 px-4 w-full h-full"
          >
            {renderInvisibleContent()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}