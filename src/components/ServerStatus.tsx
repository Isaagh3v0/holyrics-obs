type ServerStatusProps = {
    isConnected: boolean;
    label: string;
  };
  
  const ServerStatus = ({ isConnected, label }: ServerStatusProps) => {
    return (
      <p style={{ color: isConnected ? "green" : "red" }}>
        {label}: {isConnected ? "🟢 Активен" : "🔴 Неактивен"}
      </p>
    );
  };
  
  export default ServerStatus;
  