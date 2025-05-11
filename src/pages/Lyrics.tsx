import { useContext, useEffect, useState, useRef } from "react";
import { SocketContext } from "../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import MusicContent from "../components/MusicContent";
import BibleContent from "../components/BibleContent";
import React from "react";

interface TextData {
  type: "MUSIC" | "BIBLE" | "EMPTY";
  header: string | null;
  content: string[] | string;
}

export default function Lyrics() {
  const { socket } = useContext(SocketContext);
  const [textData, setTextData] = useState<TextData>({
    type: "MUSIC",
    header: null,
    content: [],
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
        
        // Сохраняем content как есть, без преобразования в строку
        const processedData: TextData = {
          ...data,
          content: data.content
        };
        
        // Обновляем данные
        setTextData(processedData);
        
        // Управляем видимостью
        if (processedData.type === "EMPTY") {
          setVisible(false);
        } else {
          const isEmpty = !processedData.content || 
            (Array.isArray(processedData.content) && processedData.content.length === 0) ||
            (typeof processedData.content === 'string' && processedData.content.trim() === "");
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
    const stepSize = 2; // Шаг изменения размера шрифта
    const maxChange = 5; // Максимальное изменение размера за один раз

    // Начинаем с текущего размера шрифта
    let currentSize = fontSize;
    invisibleDiv.style.fontSize = `${currentSize}px`;

    // Проверяем, помещается ли текст
    const isTooBig = invisibleDiv.scrollHeight > container.clientHeight || 
                    invisibleDiv.scrollWidth > container.clientWidth;
    const isTooSmall = invisibleDiv.scrollHeight < container.clientHeight * 0.8 || 
                      invisibleDiv.scrollWidth < container.clientWidth * 0.8;

    if (isTooBig) {
      // Если текст слишком большой, уменьшаем размер
      while (currentSize > minSize && 
             (invisibleDiv.scrollHeight > container.clientHeight || 
              invisibleDiv.scrollWidth > container.clientWidth)) {
        currentSize -= stepSize;
        invisibleDiv.style.fontSize = `${currentSize}px`;
      }
    } else if (isTooSmall) {
      // Если текст слишком маленький, увеличиваем размер
      while (currentSize < maxSize && 
             invisibleDiv.scrollHeight < container.clientHeight * 0.8 && 
             invisibleDiv.scrollWidth < container.clientWidth * 0.8) {
        currentSize += stepSize;
        invisibleDiv.style.fontSize = `${currentSize}px`;
      }
    }

    // Ограничиваем изменение размера
    const sizeDiff = currentSize - fontSize;
    if (Math.abs(sizeDiff) > maxChange) {
      currentSize = fontSize + (sizeDiff > 0 ? maxChange : -maxChange);
    }

    console.log("Установлен размер шрифта:", currentSize);
    setFontSize(currentSize);
  };

  // Подстройка размера текста при изменении текста или размера окна
  useEffect(() => {
    console.log("Текст или видимость изменились, пересчитываем размер");
    
    // Используем debounce для предотвращения частых пересчетов
    if (visible) {
      const timer = setTimeout(() => {
        adjustTextSize();
      }, 100); // Увеличиваем задержку для стабильности
      return () => clearTimeout(timer);
    }
  }, [textData, visible]);

  // Обработчик изменения размера окна с debounce
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;
    
    const handleResize = () => {
      if (visible) {
        console.log("Размер окна изменился, пересчитываем размер текста");
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          adjustTextSize();
        }, 100);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, [visible]);

  // Рендеринг невидимого контента для расчета размера текста
  const renderInvisibleContent = () => {
    if (textData.type === "EMPTY" || !textData.content) return null;

    return (
      <>
        {textData.header && (
          <span className="block text-[70%] mb-4">{textData.header}</span>
        )}
        <div>
          {Array.isArray(textData.content) ? (
            textData.content.map((line, index) => (
              <React.Fragment key={`invisible-${index}`}>
                {line}
                {index < textData.content.length - 1 && <br />}
              </React.Fragment>
            ))
          ) : (
            textData.content.split("\n").map((line, index, array) => (
              <React.Fragment key={`invisible-${index}`}>
                {line}
                {index < array.length - 1 && <br />}
              </React.Fragment>
            ))
          )}
        </div>
      </>
    );
  };

  // Выбор компонента контента в зависимости от типа
  const renderContent = () => {
    switch (textData.type) {
      case "BIBLE":
        return (
          <BibleContent
            header={textData.header}
            content={Array.isArray(textData.content) ? textData.content : [textData.content]}
            fontSize={fontSize}
          />
        );
      case "MUSIC":
      default:
        return (
          <MusicContent
            header={textData.header}
            content={textData.content}
            fontSize={fontSize}
          />
        );
    }
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
              key={`content-${JSON.stringify(textData.content)}`}
            >
              {renderContent()}
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