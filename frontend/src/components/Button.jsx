import "../styles/button.css";

export default function Button({ text, variant = "primary", onClick }) {
  return (
    <button className={`btn ${variant}`} onClick={onClick}>
      {text}
    </button>
  );
}
