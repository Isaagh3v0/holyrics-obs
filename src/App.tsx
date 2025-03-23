import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

interface TextData {
  type: "TEXT" | "BIBLE" | "MUSIC" | "EMPTY";
  header: string | null;
  content: string | string[];
}

export default function App() {
  const [textData, setTextData] = useState<TextData>({
    type: "TEXT",
    header: null,
    content: ""
  });
  const [fontSize, setFontSize] = useState(35);
  const [visible, setVisible] = useState(true);
  
  // Correctly type the refs
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef<HTMLDivElement>(null);
  const invisibleRef = useRef<HTMLDivElement>(null);

  // Подключение к Socket.io серверу
  useEffect(() => {
    const socket = io("http://192.168.1.200:5000");

    socket.on("connect", () => {
      console.log("Подключено к серверу");
    });

    socket.on("text", (data: TextData) => {
      // Обрабатываем тип EMPTY специально
      if (data.type === "EMPTY") {
        setVisible(false);
      } else {
        // Проверяем, есть ли контент для других типов
        const isEmpty = !data.content || 
                       (typeof data.content === 'string' && data.content.trim() === '') ||
                       (Array.isArray(data.content) && data.content.length === 0);
        
        // Устанавливаем видимость в зависимости от наличия контента
        setVisible(!isEmpty);
      }
      
      // Устанавливаем данные текста
      setTextData(data);
    });

    socket.on("disconnect", () => {
      console.log("Отключено от сервера");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Функция для обработки двойного клика для переключения полноэкранного режима
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Ошибка перехода в полноэкранный режим: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Функция для адаптации размера текста
  const adjustTextSize = () => {
    if (!visibleRef.current || !invisibleRef.current || !containerRef.current) return;

    const invisibleDiv = invisibleRef.current;
    const container = containerRef.current;

    // Начальный размер шрифта
    let currentSize = fontSize;
    const maxSize = 100; // Максимальный размер шрифта
    const minSize = 10;  // Минимальный размер шрифта

    // Сбрасываем размер шрифта для невидимого элемента
    invisibleDiv.style.fontSize = `${maxSize}px`;

    // Если невидимый элемент выходит за пределы контейнера, уменьшаем размер
    if (invisibleDiv.scrollHeight > container.clientHeight || 
        invisibleDiv.scrollWidth > container.clientWidth) {
      
      // Бинарный поиск для нахождения оптимального размера шрифта
      let min = minSize;
      let max = maxSize;
      
      while (min <= max) {
        const mid = Math.floor((min + max) / 2);
        invisibleDiv.style.fontSize = `${mid}px`;
        
        if (invisibleDiv.scrollHeight > container.clientHeight || 
            invisibleDiv.scrollWidth > container.clientWidth) {
          max = mid - 1;
        } else {
          min = mid + 1;
          currentSize = mid;
        }
      }
    } else {
      currentSize = maxSize;
    }
    
    // Применяем новый размер шрифта для видимого элемента
    setFontSize(currentSize);
  };

  // Вызываем adjustTextSize при изменении текста или при изменении размера окна
  useEffect(() => {
    if (visible) {
      adjustTextSize();
    }
    
    const handleResize = () => {
      if (visible) {
        adjustTextSize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [textData, visible]);

  // Рендерим библейский текст
  const renderBibleContent = () => {
    if (!textData.content || !Array.isArray(textData.content) || textData.content.length === 0) {
      return null;
    }

    const primaryText = textData.content[0];
    const secondaryText = textData.content[1];
    const header = textData.header;
    var verseNumber;

    if(header) verseNumber = parseInt(header.split(":")[1].trim());

    return (
      <>
        {header && (
          <motion.span 
            className="header bible-header-custom" 
            style={{ fontSize: '70%', display: 'block', marginBottom: '10px' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {header}
          </motion.span>
        )}
        <motion.span 
          className="bible_slide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <span style={{ fontSize: '50%' }}><sup>{verseNumber}</sup></span>
          <sup><span style={{ fontSize: '50%' }}>&nbsp;</span></sup>
          {primaryText}
          {secondaryText && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <br /><br />
              <span style={{ fontSize: '50%' }}><sup>{verseNumber}</sup></span>
              <sup><span style={{ fontSize: '50%' }}>&nbsp;</span></sup>
              {secondaryText}
            </motion.span>
          )}
          &nbsp; &nbsp; &nbsp; &nbsp;
        </motion.span>
      </>
    );
  };

  // Рендерим текст с типом MUSIC с обработкой переносов строк
  const renderMusicContent = () => {
    if (!textData.content) return null;
    
    const content = typeof textData.content === 'string' ? textData.content : '';
    const header = textData.header;
    
    // Разбиваем текст по символам новой строки и создаем JSX с переносами
    const lineArray = content.split('\n');
    const lines = lineArray.map((line, index) => (
      <motion.span 
        key={index}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 + (index * 0.05) }}
      >
        {line}
        {index < lineArray.length - 1 && <br />}
      </motion.span>
    ));

    return (
      <>
        {header && (
          <motion.span 
            className="header" 
            style={{ fontSize: '70%', display: 'block', marginBottom: '10px' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {header}
          </motion.span>
        )}
        <motion.div className="music-content">
          {lines}
        </motion.div>
      </>
    );
  };

  // Рендерим обычный текст
  const renderTextContent = () => {
    const content = typeof textData.content === 'string' ? textData.content : '';
    const header = textData.header;
    
    // Разбиваем текст по символам новой строки и создаем JSX с переносами
    const lineArray = content.split('\n');
    const lines = lineArray.map((line, index) => (
      <motion.span 
        key={index}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 + (index * 0.05) }}
      >
        {line}
        {index < lineArray.length - 1 && <br />}
      </motion.span>
    ));

    return (
      <>
        {header && (
          <motion.span 
            className="header" 
            style={{ fontSize: '70%', display: 'block', marginBottom: '10px' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {header}
          </motion.span>
        )}
        <motion.div>
          {lines}
        </motion.div>
      </>
    );
  };

  // Определяем, какой контент рендерить в зависимости от типа
  const renderContent = () => {
    switch (textData.type) {
      case 'BIBLE':
        return renderBibleContent();
      case 'MUSIC':
        return renderMusicContent();
      case 'EMPTY':
        return null;
      default:
        return renderTextContent();
    }
  };

  // Для невидимого div мы рендерим контент без анимаций
  const renderInvisibleContent = () => {
    if (textData.type === 'EMPTY') {
      return null;
    }
    
    switch (textData.type) {
      case 'BIBLE':
        if (!textData.content || !Array.isArray(textData.content) || textData.content.length === 0) {
          return null;
        }
        const primaryText = textData.content[0];
        const secondaryText = textData.content[1];
        const header = textData.header;
        let verseNumber = 0;
        if (header) verseNumber = parseInt(header.split(":")[1].trim());
        return (
          <>
            {textData.header && (
              <span className="header bible-header-custom" style={{ fontSize: '70%', display: 'block', marginBottom: '10px' }}>
                {textData.header}
              </span>
            )}
            <span className="bible_slide">
              <span style={{ fontSize: '50%' }}><sup>{verseNumber}</sup></span>
              <sup><span style={{ fontSize: '50%' }}>&nbsp;</span></sup>
              {primaryText}
              {secondaryText && (
                <>
                  <br /><br />
                  <span style={{ fontSize: '50%' }}><sup>{verseNumber}</sup></span>
                  <sup><span style={{ fontSize: '50%' }}>&nbsp;</span></sup>
                  {secondaryText}
                </>
              )}
            </span>
          </>
        );
      case 'MUSIC':
      case 'TEXT':
      default:
        const content = typeof textData.content === 'string' ? textData.content : '';
        const lines = content.split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < content.split('\n').length - 1 && <br />}
          </React.Fragment>
        ));
        return (
          <>
            {textData.header && (
              <span className="header" style={{ fontSize: '70%', display: 'block', marginBottom: '10px' }}>
                {textData.header}
              </span>
            )}
            <div>{lines}</div>
          </>
        );
    }
  };

  // Анимационные варианты для разных состояний с более плавными переходами
  const containerVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 1.2,  // Увеличиваем длительность для более плавного перехода
        ease: "easeInOut",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { 
        duration: 1.2,  // Увеличиваем длительность для более плавного перехода
        ease: "easeInOut" 
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div 
          key="screen-container"
          ref={containerRef}
          className="screen-custom" 
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            position: 'relative'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          onDoubleClick={toggleFullscreen}
        >
          <motion.div 
            key="text-container"
            id="display" 
            className="text-custom" 
            style={{ 
              color: 'rgb(250, 250, 250)', 
              textAlign: 'center', 
              backgroundColor: 'transparent', 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <motion.div 
              ref={visibleRef}
              id="visible" 
              style={{ 
                fontFamily: 'Arial', 
                paddingTop: '13.5px', 
                paddingLeft: '2%', 
                paddingRight: '2%', 
                width: '100%',
                maxHeight: '100%',
                fontSize: `${fontSize}px`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textShadow: '0 0 8px rgba(255, 255, 255, 0.2)'
              }}
            >
              {renderContent()}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}