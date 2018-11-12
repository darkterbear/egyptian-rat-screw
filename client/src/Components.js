import React, { Component } from 'react'

export class Logo extends Component {
	render() {
		return <h2 className="logo">egyptian ratscrew</h2>
	}
}

export class Button extends Component {
	render() {
		return (
			<div
				style={this.props.style}
				onClick={this.props.onClick}
				className="button">
				{this.props.text}
			</div>
		)
	}
}
