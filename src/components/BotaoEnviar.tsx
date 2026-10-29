export function BotaoEnviar({ children }: { children: React.ReactNode }) {
  // Fica desabilitado enquanto o Formulario envia (fieldset desabilitado).
  return (
    <button type="submit" className="botao">
      {children}
    </button>
  );
}
