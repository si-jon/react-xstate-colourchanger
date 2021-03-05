export const grammar = `
<grammar root="quotes">
  <rule id="quotes">
    <one-of>
      <item>to do is to be<tag>out="socrates";</tag></item>
      <item>to be is to do<tag>out="sartre";</tag></item>
      <item>do be do be do<tag>out="sinatra";</tag></item>
    </one-of>
  </rule>
</grammar>
`