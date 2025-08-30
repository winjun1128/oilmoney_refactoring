import OilDashboard from './OilDashboard';
import SidoPrice from './SidoPrice';

export default function FinalProject() {

    return (

        <div>
            {/* AllAvgPrice와 AvgRecentPrice가 들어있는 OilDashboard 컴포넌트임 */}
            <OilDashboard />
            <SidoPrice />
        </div>

    );

}