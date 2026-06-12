import { render, screen } from '@testing-library/react-native';
import { UserGreeting } from '../user-greeting';

describe('UserGreeting Component', () => {
  it('renders the greeting message with the provided user name', () => {
    // Arrange
    const userName = 'Carlos';

    // Act
    render(<UserGreeting name={userName} />);

    // Assert
    expect(screen.getByText('Hola, Carlos!')).toBeTruthy();
  });

  it('matches the snapshot to prevent visual regressions', () => {
    // Arrange
    const userName = 'Carlos';

    // Act
    const { toJSON } = render(<UserGreeting name={userName} />);

    // Assert
    expect(toJSON()).toMatchSnapshot();
  });
});

