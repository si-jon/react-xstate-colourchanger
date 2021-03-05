export const grammar = `
<grammar root="command">
    <rule id="command">
        <ruleref uri="#polite"/>
        <one-of>
            <item><ruleref uri="#on_off"/><tag> out=rules.on_off; </tag></item>
            <item><ruleref uri="#open_close"/><tag> out=rules.open_close; </tag></item>
        </one-of>
        <ruleref uri="#polite"/>
    </rule> 
    <rule id="on_off">
        <ruleref uri="#on_off_action"/>
        <item repeat="0-1">the</item>
        <ruleref uri="#on_off_object"/>
        <tag>
            out.action=rules.on_off_action;
            out.object=rules.on_off_object;
        </tag>
    </rule> 
    <rule id="open_close">
        <ruleref uri="#open_close_action"/>
        <item repeat="0-1">the</item>
        <ruleref uri="#open_close_object"/>
        <tag>
            out.action=rules.open_close_action;
            out.object=rules.open_close_object;
        </tag>
    </rule> 
    <rule id="on_off_action">
        <one-of>
            <item> turn off <tag> out = 'off'; </tag> </item>
            <item> turn on <tag> out = 'on'; </tag> </item>
        </one-of>
    </rule> 
    <rule id="on_off_object">
        <one-of>
            <item> light </item>
            <item> lights <tag> out = 'light'; </tag></item>
            <item> heat </item>
            <item> AC <tag> out = 'air conditioning'; </tag></item>
            <item> air-conditioning </item>
        </one-of>
    </rule>
    <rule id="open_close_action">
        <one-of>
            <item> open </item>
            <item> close </item>
        </one-of>
    </rule> 
    <rule id="open_close_object">
        <one-of>
            <item> window </item>
            <item> door </item>
        </one-of>
    </rule>
    <rule id="polite">
        <item repeat="0-1">
            <one-of>
                <item> could you </item>
                <item> would you </item>
            </one-of>
        </item>
        <item repeat="0-1">
            <one-of>
                <item> please </item>
                <item> kindly </item>
            </one-of>
        </item>
    </rule> 
</grammar>
`