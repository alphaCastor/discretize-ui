import React, { ReactElement } from 'react';

import Tooltip, { TooltipProps } from '../Tooltip/Tooltip';
import IconWithText from '../IconWithText/IconWithText';
import WikiLink, { WikiLinkProps } from '../WikiLink/WikiLink';
import { useSkill } from '../../gw2api/hooks';

export interface SkillProps {
  id: number;
  disableIcon?: boolean;
  disableText?: boolean;
  disableLink?: boolean;
  disableTooltip?: boolean;
  inline?: boolean;
  tooltipProps?: TooltipProps;
  wikiLinkProps?: WikiLinkProps;
}

export interface SkillDataProps {
  name: string;
  icon: string;
  professions: string[];
}

const Skill = (props: SkillProps): ReactElement => {
  let {
    id,
    disableIcon,
    disableText,
    disableLink,
    disableTooltip,
    inline,
    tooltipProps,
    wikiLinkProps,
  } = props;
  const data = useSkill(id);

  if (data === 'LOADING') {
    return <IconWithText {...props} loading={true} />;
  } else if (data === 'ERROR') {
    // TODO: port and use <Error />
    return (
      <IconWithText
        {...props}
        text="Unknown Skill"
        // TODO: decide on a good error icon
        icon="https://render.guildwars2.com/file/A5DE06130C0D1E2C9A9780EAD037E61462B1E825/102597.png"
      />
    );
  }

  const { name, icon, professions } = data;

  const profession = professions?.length && professions[0].toLowerCase();

  return (
    <Tooltip
      content={
        /* <AbilityDetails data={data} type="skills" /> */
        <>{JSON.stringify(data)}</>
      }
      disabled={disableTooltip}
      {...tooltipProps}
    >
      <IconWithText
        icon={icon}
        text={
          disableLink ? (
            name
          ) : (
            <WikiLink
              to={name}
              {...wikiLinkProps}
              sx={{
                // TODO remove theme-ui from here. Unsure how to proceed.
                color: 'inherit',
                '&:hover': {
                  color: `var(--gw2-color-${profession}-dark)`,
                },
                ...wikiLinkProps?.sx,
              }}
            />
          )
        }
        disableIcon={disableIcon}
        disableText={disableText}
        inline={inline}
        iconProps={{ zoom: 5 }}
        style={{ color: `var(--gw2-color-${profession}-main)` }}
      />
    </Tooltip>
  );
};

export default Skill;
