import React from 'react'
import VerifInput from './VerifInput'
import '../styles/components/expandable_form.scss'

export default React.createClass({
    getInitialState() {
        return { expanded: false }
    },

    toggleExpand(e) {
        e.preventDefault()
        this.setState({ expanded: !this.state.expanded })
    },

    handleLogin(e) {
        e.preventDefault()
        this.props.onLogin(this.refs.username.value, this.refs.password.value)
    },

    handleRegister(e) {
        e.preventDefault()
        this.props.onRegister(
            this.refs.username.value,
            this.refs.password.value,
            this.refs.passwordbis.value
        )
    },

    render() {
        const { disabled } = this.props
        const { expanded } = this.state

        const passwordBis = (
            <input
                ref="passwordbis"
                type="password"
                placeholder="password (again)" />)

        return (<div className="exp-form-wrapper">
            <form
                onSubmit = { expanded ? this.handleRegister : this.handleLogin }>
                <input ref="username" placeholder="username" />
                <input
                    ref="password"
                    type="password"
                    placeholder="password"
                />
                { expanded && passwordBis }
                <input
                    type = "submit"
                    disabled = { disabled }
                    value = { expanded ? "Register" : "Login" }
                />
            </form>
            <a
                onClick={this.toggleExpand}>
                { expanded ? "Back to login" : "Create an account" }
            </a>
        </div>)
    }
})
