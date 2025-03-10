import styled from "@emotion/styled";
import { token } from "@atlaskit/tokens";
import WarningIcon from "@atlaskit/icon/glyph/warning";
import ErrorIcon from "@atlaskit/icon/glyph/error";
import { ErrorType } from "../../rest-interfaces/oauth-types";

type ErrorWrapperType = {
	type: ErrorType
}

const ErrorWrapper = styled.div<ErrorWrapperType>`
	display: flex;
	justify-content: start;
	width: 100%;
	box-sizing: border-box;
	padding: ${token("space.200")};
	margin: ${token("space.200")} auto;
	text-align: left;
	background: ${props => props.type === "warning" ? token("color.background.warning") : token("color.background.danger") };
	border-radius: 3px;
	align-items: center;
	div {
		padding-left: ${token("space.100")};
	}
	span {
		align-self: start;
	}
`;

const Error = ({
	type,
	message,
}: {
	type: ErrorType,
	message: React.JSX.Element | string
}) => {


	return (
		<ErrorWrapper type={type}>
			{
				type === "warning" ? <WarningIcon label="warning" primaryColor={token("color.background.warning.bold")} size="medium" /> :
					<ErrorIcon label="warning" primaryColor={token("color.background.danger.bold")} size="medium" />
			}
			<div>{message}</div>
		</ErrorWrapper>
	);
};

export default Error;
