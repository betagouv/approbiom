import './Button.css'

export default function Button({ children, ...props }) {
    return (
        <button type="button" className="shared-button" {...props}>
            {children}
        </button>
    )
}
